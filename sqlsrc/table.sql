
create table pinfo (id INT(6) AUTO_INCREMENT PRIMARY KEY,
username varchar(30) NOT NULL,
password varchar(10) NOT NULL,
name varchar(30) NOT NULL,
regtime TIMESTAMP
);


create table message (id INT(6) AUTO_INCREMENT PRIMARY KEY,
receiver varchar(30) NOT NULL,
sender varchar(30) NOT NULL,
content varchar(200) NOT NULL,
sendtime TIMESTAMP
);
